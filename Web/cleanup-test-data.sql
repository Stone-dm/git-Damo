-- =============================================
-- 清空所有用户和党员相关数据（按外键依赖倒序）
-- 执行方式（Docker）：
--   docker exec -i party_school-mysql-1 mysql -u party -pparty123 party_school < Web/cleanup-test-data.sql
-- 或本地直连 MySQL：
--   mysql -u party -pparty123 -h localhost -P 3307 party_school < Web/cleanup-test-data.sql
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM task_progress;
DELETE FROM tasks;
DELETE FROM training_records;
DELETE FROM training_plans;
DELETE FROM exams;
DELETE FROM learning_contents;
DELETE FROM development_records;
DELETE FROM member_documents;
DELETE FROM floating_contact_records;
DELETE FROM cultivation_contacts;
DELETE FROM member_profiles;
DELETE FROM users;
DELETE FROM branches;

SET FOREIGN_KEY_CHECKS = 1;
