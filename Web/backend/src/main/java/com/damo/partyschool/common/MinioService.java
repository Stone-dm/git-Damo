package com.damo.partyschool.common;

import java.io.InputStream;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import jakarta.annotation.PostConstruct;

@Service
public class MinioService {

    private static final Logger log = LoggerFactory.getLogger(MinioService.class);

    private final MinioClient minioClient;
    private final String bucket;

    public MinioService(MinioClient minioClient, @Value("${app.minio.bucket}") String bucket) {
        this.minioClient = minioClient;
        this.bucket = bucket;
    }

    @PostConstruct
    void ensureBucket() {
        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("Created MinIO bucket: {}", bucket);
            }
        } catch (Exception e) {
            log.warn("MinIO bucket check failed (will retry on first upload): {}", e.getMessage());
        }
    }

    public String upload(String prefix, String originalName, InputStream stream, String contentType, long size) {
        try {
            String objectName = prefix + "/" + UUID.randomUUID() + "_" + sanitize(originalName);
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .stream(stream, size, -1)
                            .contentType(contentType)
                            .build());
            log.info("Uploaded to MinIO: {}", objectName);
            return objectName;
        } catch (Exception e) {
            throw new RuntimeException("MinIO upload failed", e);
        }
    }

    public void delete(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder().bucket(bucket).object(objectName).build());
        } catch (Exception e) {
            log.warn("MinIO delete failed (non-fatal): {}", e.getMessage());
        }
    }

    public String getPresignedUrl(String objectName) {
        if (objectName == null || objectName.isBlank()) return null;
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .method(Method.GET)
                            .expiry(3600)
                            .build());
        } catch (Exception e) {
            log.warn("MinIO presigned URL failed: {}", e.getMessage());
            return null;
        }
    }

    private static String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
