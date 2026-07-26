package com.damo.partyschool.archive;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "branch_archives")
@Getter
@Setter
@NoArgsConstructor
public class BranchArchive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 关联 Branch.id */
    @Column(nullable = false)
    private Long branchId;

    /** 归档类别 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ArchiveCategory category;

    /** 材料标题 */
    @Column(nullable = false, length = 200)
    private String title;

    /** 文本内容（会议纪要、活动总结等） */
    @Column(columnDefinition = "TEXT")
    private String content;

    /** MinIO 存储路径（附件，可选） */
    @Column(length = 500)
    private String fileUrl;

    /** 附件原始文件名 */
    @Column(length = 255)
    private String fileName;

    /** 材料对应的发生日期（如会议日期） */
    @Column(nullable = false)
    private LocalDate recordDate;

    /** 上传时间 */
    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    /** 上传人 */
    @Column(nullable = false)
    private Long uploaderId;

    // ---- 三会一课结构化字段 ----

    /** 主持人 User.id */
    private Long hostUserId;

    /** 记录人 User.id */
    private Long recorderUserId;

    /** 应到人数 */
    private Integer expectedCount;

    /** 实到人数 */
    private Integer actualCount;

    /** 缺席人数 */
    private Integer absentCount;

    /** 会议议题（逗号分隔） */
    @Column(length = 500)
    private String topics;

    /** 会议地点 */
    @Column(length = 200)
    private String location;
}
