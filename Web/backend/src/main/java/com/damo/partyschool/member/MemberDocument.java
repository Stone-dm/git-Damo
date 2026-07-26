package com.damo.partyschool.member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "member_documents")
@Getter
@Setter
@NoArgsConstructor
public class MemberDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 关联 User.id */
    @Column(nullable = false)
    private Long userId;

    /** 材料类型 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DocType docType;

    /** 材料标题 */
    @Column(nullable = false, length = 200)
    private String title;

    /** MinIO 存储路径 */
    @Column(nullable = false, length = 500)
    private String fileUrl;

    /** 原始文件名 */
    @Column(nullable = false, length = 255)
    private String fileName;

    /** 上传时间 */
    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    /** 上传人 */
    @Column(nullable = false)
    private Long uploaderId;
}
