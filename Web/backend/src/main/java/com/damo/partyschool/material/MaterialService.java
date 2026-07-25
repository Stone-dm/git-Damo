package com.damo.partyschool.material;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.common.MinioService;
import com.damo.partyschool.user.Role;

@Service
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final MinioService minioService;

    public MaterialService(MaterialRepository materialRepository, MinioService minioService) {
        this.materialRepository = materialRepository;
        this.minioService = minioService;
    }

    @Transactional(readOnly = true)
    public List<MaterialView> list(UserPrincipal actor) {
        List<Material> materials;
        if (actor.getRole() == Role.ADMIN) {
            materials = materialRepository.findAll();
            materials.sort(Comparator.comparing(Material::getCreatedAt).reversed());
        } else if (actor.getBranchId() == null) {
            materials = List.of();
        } else {
            materials = materialRepository.findVisibleForBranch(actor.getBranchId());
        }
        return materials.stream()
                .map(m -> MaterialView.from(m, minioService.getPresignedUrl(m.getFileUrl())))
                .toList();
    }

    @Transactional
    public MaterialView upload(UserPrincipal actor, String title, MaterialType type,
            MultipartFile file) throws IOException {
        Material material = new Material();
        material.setTitle(title.trim());
        material.setType(type);
        material.setBranchId(actor.getBranchId());
        material.setUploaderId(actor.getId());

        if (type == MaterialType.TEXT) {
            // Text is stored in DB directly
            material.setContent(new String(file.getBytes()));
        } else {
            // IMAGE / VIDEO — upload to MinIO
            String objectName = minioService.upload(
                    type.name().toLowerCase(),
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "file",
                    file.getInputStream(),
                    file.getContentType(),
                    file.getSize());
            material.setFileUrl(objectName);
        }

        material = materialRepository.save(material);
        return MaterialView.from(material, minioService.getPresignedUrl(material.getFileUrl()));
    }

    @Transactional
    public void delete(UserPrincipal actor, Long id) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("素材不存在"));
        // Only admin or creator can delete
        if (actor.getRole() != Role.ADMIN && !actor.getId().equals(material.getUploaderId())) {
            throw new org.springframework.security.access.AccessDeniedException("无权删除该素材");
        }
        // Delete from MinIO if applicable
        if (material.getFileUrl() != null) {
            minioService.delete(material.getFileUrl());
        }
        materialRepository.delete(material);
    }
}
