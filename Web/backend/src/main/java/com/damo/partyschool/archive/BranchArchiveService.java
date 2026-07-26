package com.damo.partyschool.archive;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.auth.UserView;
import com.damo.partyschool.common.MinioService;
import com.damo.partyschool.common.MinioUnavailableException;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.User;
import com.damo.partyschool.user.UserRepository;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class BranchArchiveService {

    private static final String BUCKET = "partyschool";
    private static final String PREFIX = "branch-archives";
    private static final int PRESIGNED_EXPIRY_MINUTES = 10;

    private final BranchArchiveRepository repository;
    private final MinioService minioService;
    private final UserRepository userRepository;

    public BranchArchiveService(BranchArchiveRepository repository, MinioService minioService,
            UserRepository userRepository) {
        this.repository = repository;
        this.minioService = minioService;
        this.userRepository = userRepository;
    }

    // ---- CRUD ----

    /** 创建归档材料（支持可选附件及三会一课结构化字段） */
    @Transactional
    public BranchArchiveView create(UserPrincipal actor, Long branchId,
            ArchiveCategory category, String title, String content,
            LocalDate recordDate, MultipartFile file,
            Long hostUserId, Long recorderUserId,
            Integer expectedCount, Integer actualCount, Integer absentCount,
            String topics, String location) {
        requireManageBranch(actor, branchId);

        BranchArchive archive = new BranchArchive();
        archive.setBranchId(branchId);
        archive.setCategory(category);
        archive.setTitle(title.trim());
        archive.setContent(content != null ? content.trim() : null);
        archive.setRecordDate(recordDate != null ? recordDate : LocalDate.now());
        archive.setUploadedAt(LocalDateTime.now());
        archive.setUploaderId(actor.getId());

        // 三会一课字段
        archive.setHostUserId(hostUserId);
        archive.setRecorderUserId(recorderUserId);
        archive.setExpectedCount(expectedCount);
        archive.setActualCount(actualCount);
        archive.setAbsentCount(absentCount);
        archive.setTopics(topics != null ? topics.trim() : null);
        archive.setLocation(location != null ? location.trim() : null);

        if (file != null && !file.isEmpty()) {
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String sanitized = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            String objectName = String.format("%s/%d/%s/%s_%s",
                    PREFIX, branchId, category.name(), UUID.randomUUID(), sanitized);
            try {
                minioService.uploadFile(BUCKET, objectName,
                        file.getInputStream(), file.getContentType(), file.getSize());
            } catch (IOException e) {
                throw new RuntimeException("文件读取失败", e);
            }
            archive.setFileUrl(objectName);
            archive.setFileName(originalName);
        }

        archive = repository.save(archive);
        return BranchArchiveView.from(archive, resolveUserName(hostUserId), resolveUserName(recorderUserId));
    }

    /** 列表查询（支持 category 和日期范围筛选） */
    @Transactional(readOnly = true)
    public List<BranchArchiveView> list(UserPrincipal actor, Long branchId,
            String category, LocalDate dateFrom, LocalDate dateTo) {
        requireViewBranch(actor, branchId);

        List<BranchArchive> list;
        if (category != null && !category.isBlank()) {
            ArchiveCategory cat;
            try {
                cat = ArchiveCategory.valueOf(category);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("无效的归档类别: " + category);
            }
            list = repository.findByBranchIdAndCategory(branchId, cat);
        } else if (dateFrom != null && dateTo != null) {
            list = repository.findByBranchIdAndRecordDateBetween(branchId, dateFrom, dateTo);
        } else {
            list = repository.findByBranchIdOrderByRecordDateDesc(branchId);
        }

        if (category != null && !category.isBlank() && dateFrom != null && dateTo != null) {
            list = list.stream()
                    .filter(a -> !a.getRecordDate().isBefore(dateFrom) && !a.getRecordDate().isAfter(dateTo))
                    .toList();
        }

        return list.stream().map(a -> BranchArchiveView.from(a, resolveUserName(a.getHostUserId()), resolveUserName(a.getRecorderUserId()))).toList();
    }

    /** 获取详情 */
    @Transactional(readOnly = true)
    public BranchArchiveView get(UserPrincipal actor, Long branchId, Long id) {
        requireViewBranch(actor, branchId);
        BranchArchive archive = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("归档材料不存在"));
        if (!archive.getBranchId().equals(branchId)) {
            throw new IllegalArgumentException("归档材料不属于该支部");
        }
        return BranchArchiveView.from(archive, resolveUserName(archive.getHostUserId()), resolveUserName(archive.getRecorderUserId()));
    }

    /** 编辑归档材料 */
    @Transactional
    public BranchArchiveView update(UserPrincipal actor, Long branchId, Long id,
            ArchiveCategory category, String title, String content,
            LocalDate recordDate, MultipartFile file,
            Long hostUserId, Long recorderUserId,
            Integer expectedCount, Integer actualCount, Integer absentCount,
            String topics, String location) {
        requireManageBranch(actor, branchId);
        BranchArchive archive = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("归档材料不存在"));
        if (!archive.getBranchId().equals(branchId)) {
            throw new IllegalArgumentException("归档材料不属于该支部");
        }

        if (category != null) archive.setCategory(category);
        if (title != null) archive.setTitle(title.trim());
        if (content != null) archive.setContent(content.trim());
        if (recordDate != null) archive.setRecordDate(recordDate);

        // 三会一课字段（允许清空）
        archive.setHostUserId(hostUserId);
        archive.setRecorderUserId(recorderUserId);
        archive.setExpectedCount(expectedCount);
        archive.setActualCount(actualCount);
        archive.setAbsentCount(absentCount);
        archive.setTopics(topics != null ? topics.trim() : null);
        archive.setLocation(location != null ? location.trim() : null);

        if (file != null && !file.isEmpty()) {
            if (archive.getFileUrl() != null) {
                minioService.deleteFile(BUCKET, archive.getFileUrl());
            }
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String sanitized = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            String objectName = String.format("%s/%d/%s/%s_%s",
                    PREFIX, branchId, archive.getCategory().name(), UUID.randomUUID(), sanitized);
            try {
                minioService.uploadFile(BUCKET, objectName,
                        file.getInputStream(), file.getContentType(), file.getSize());
            } catch (IOException e) {
                throw new RuntimeException("文件读取失败", e);
            }
            archive.setFileUrl(objectName);
            archive.setFileName(originalName);
        }

        archive = repository.save(archive);
        return BranchArchiveView.from(archive, resolveUserName(hostUserId), resolveUserName(recorderUserId));
    }

    /** 删除归档材料 */
    @Transactional
    public void delete(UserPrincipal actor, Long branchId, Long id) {
        requireManageBranch(actor, branchId);
        BranchArchive archive = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("归档材料不存在"));
        if (!archive.getBranchId().equals(branchId)) {
            throw new IllegalArgumentException("归档材料不属于该支部");
        }
        if (archive.getFileUrl() != null) {
            minioService.deleteFile(BUCKET, archive.getFileUrl());
        }
        repository.delete(archive);
    }

    /** 获取附件预签名下载URL */
    @Transactional(readOnly = true)
    public String getFilePresignedUrl(UserPrincipal actor, Long branchId, Long id) {
        requireViewBranch(actor, branchId);
        BranchArchive archive = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("归档材料不存在"));
        if (!archive.getBranchId().equals(branchId)) {
            throw new IllegalArgumentException("归档材料不属于该支部");
        }
        if (archive.getFileUrl() == null) {
            throw new IllegalArgumentException("该材料无附件");
        }
        String url = minioService.getPresignedUrl(BUCKET, archive.getFileUrl(), PRESIGNED_EXPIRY_MINUTES);
        if (url == null) {
            throw new MinioUnavailableException("MinIO 服务不可用，无法获取文件预览链接");
        }
        return url;
    }

    /** 获取支部内可选的用户列表（用于主持人、记录人选人） */
    @Transactional(readOnly = true)
    public List<UserView> listBranchUsers(UserPrincipal actor, Long branchId) {
        requireViewBranch(actor, branchId);
        return userRepository.findAll().stream()
                .filter(u -> Objects.equals(u.getBranchId(), branchId))
                .map(UserView::from)
                .toList();
    }

    // ---- helpers ----

    private String resolveUserName(Long userId) {
        if (userId == null) return null;
        return userRepository.findById(userId).map(User::getName).orElse(null);
    }

    private void requireViewBranch(UserPrincipal actor, Long branchId) {
        if (actor.getRole() == Role.ADMIN) return;
        if (actor.getRole() == Role.SECRETARY) {
            if (actor.getBranchId() != null && Objects.equals(actor.getBranchId(), branchId)) return;
            throw new AccessDeniedException("书记仅可查看本支部归档材料");
        }
        throw new AccessDeniedException("无权查看归档材料");
    }

    private void requireManageBranch(UserPrincipal actor, Long branchId) {
        if (actor.getRole() == Role.ADMIN) return;
        if (actor.getRole() == Role.SECRETARY) {
            if (actor.getBranchId() != null && Objects.equals(actor.getBranchId(), branchId)) return;
            throw new AccessDeniedException("书记仅可管理本支部归档材料");
        }
        throw new AccessDeniedException("无权管理归档材料");
    }
}
