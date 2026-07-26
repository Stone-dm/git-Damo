package com.damo.partyschool.member;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.common.MinioService;
import com.damo.partyschool.common.MinioUnavailableException;
import com.damo.partyschool.user.Role;
import com.damo.partyschool.user.UserService;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MemberDocumentService {

    private static final String BUCKET = "partyschool";
    private static final int PRESIGNED_EXPIRY_MINUTES = 10;

    private final MemberDocumentRepository docRepository;
    private final UserService userService;
    private final MinioService minioService;

    public MemberDocumentService(
            MemberDocumentRepository docRepository,
            UserService userService,
            MinioService minioService) {
        this.docRepository = docRepository;
        this.userService = userService;
        this.minioService = minioService;
    }

    /** 上传档案材料 */
    @Transactional
    public MemberDocumentView upload(
            Long userId,
            String docType,
            String title,
            MultipartFile file,
            UserPrincipal uploader) {
        // 权限：ADMIN、SECRETARY 或 本人
        requireUploadPermission(uploader, userId);

        DocType type;
        try {
            type = DocType.valueOf(docType);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("无效的材料类型: " + docType);
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String sanitized = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String objectName = String.format("member-documents/%d/%s/%s_%s",
                userId, docType, UUID.randomUUID(), sanitized);

        try {
            minioService.uploadFile(BUCKET, objectName,
                    file.getInputStream(), file.getContentType(), file.getSize());
        } catch (IOException e) {
            throw new RuntimeException("文件读取失败", e);
        }

        MemberDocument doc = new MemberDocument();
        doc.setUserId(userId);
        doc.setDocType(type);
        doc.setTitle(title);
        doc.setFileUrl(objectName);
        doc.setFileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        doc.setUploadedAt(LocalDateTime.now());
        doc.setUploaderId(uploader.getId());

        doc = docRepository.save(doc);
        return MemberDocumentView.from(doc);
    }

    /** 查看某党员的档案材料列表 */
    @Transactional(readOnly = true)
    public List<MemberDocumentView> listByUser(Long userId, UserPrincipal actor) {
        userService.requireAccessibleUser(actor, userId);
        return docRepository.findByUserId(userId).stream()
                .map(MemberDocumentView::from)
                .toList();
    }

    /** 获取文件预签名URL（用于下载/预览） */
    @Transactional(readOnly = true)
    public String getFilePresignedUrl(Long userId, Long docId, UserPrincipal actor) {
        userService.requireAccessibleUser(actor, userId);
        MemberDocument doc = docRepository.findById(docId)
                .orElseThrow(() -> new IllegalArgumentException("材料不存在"));
        if (!doc.getUserId().equals(userId)) {
            throw new IllegalArgumentException("材料不属于该党员");
        }
        String url = minioService.getPresignedUrl(BUCKET, doc.getFileUrl(), PRESIGNED_EXPIRY_MINUTES);
        if (url == null) {
            throw new MinioUnavailableException("MinIO 服务不可用，无法获取文件预览链接");
        }
        return url;
    }

    /** 删除档案材料（同时删除 MinIO 文件） */
    @Transactional
    public void delete(Long docId, UserPrincipal actor) {
        MemberDocument doc = docRepository.findById(docId)
                .orElseThrow(() -> new IllegalArgumentException("材料不存在"));
        requireUploadPermission(actor, doc.getUserId());
        minioService.deleteFile(BUCKET, doc.getFileUrl());
        docRepository.delete(doc);
    }

    // ---- helpers ----

    private void requireUploadPermission(UserPrincipal actor, Long targetUserId) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }
        if (actor.getRole() == Role.SECRETARY) {
            // 书记仅可管理本支部党员的材料
            userService.requireAccessibleUser(actor, targetUserId);
            return;
        }
        // MEMBER 不可上传/删除任何材料（包括自己的）
        throw new SecurityException("无权操作档案材料，仅管理员和支部书记可上传/删除");
    }
}
