package com.damo.partyschool.question;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ExcelQuestionParser {

    private static final Logger log = LoggerFactory.getLogger(ExcelQuestionParser.class);

    record ParseResult(List<Question> questions, List<String> errors) {}

    public ParseResult parse(InputStream stream) {
        List<Question> questions = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(stream)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() < 2) {
                errors.add("Excel 文件至少需要包含表头行和一行数据");
                return new ParseResult(questions, errors);
            }

            Row headerRow = sheet.getRow(0);
            Map<String, Integer> cols = mapColumns(headerRow);

            if (!cols.containsKey("stem")) {
                errors.add("未找到题目/题干列，请确保表头包含「题目」「题干」等列名");
                return new ParseResult(questions, errors);
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    Question q = parseRow(row, cols, i + 1);
                    if (q != null && q.getStem() != null && !q.getStem().isBlank()) {
                        q.setOrderNum(i);
                        questions.add(q);
                    }
                } catch (Exception e) {
                    errors.add("第" + (i + 1) + "行解析失败: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            errors.add("Excel 文件读取失败: " + e.getMessage());
            log.error("Excel parse error", e);
        }

        return new ParseResult(questions, errors);
    }

    private Map<String, Integer> mapColumns(Row headerRow) {
        Map<String, Integer> cols = new LinkedHashMap<>();
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            if (cell == null) continue;
            String header = cell.getStringCellValue().trim().toLowerCase();

            if (matches(header, "题目", "题干", "问题", "stem", "question")) {
                cols.put("stem", i);
            } else if (matches(header, "题型", "类型", "type")) {
                cols.put("type", i);
            } else if (matches(header, "选项a", "选项 a", "a", "choice a")) {
                cols.putIfAbsent("A", i);
            } else if (matches(header, "选项b", "选项 b", "b", "choice b")) {
                cols.putIfAbsent("B", i);
            } else if (matches(header, "选项c", "选项 c", "c", "choice c")) {
                cols.putIfAbsent("C", i);
            } else if (matches(header, "选项d", "选项 d", "d", "choice d")) {
                cols.putIfAbsent("D", i);
            } else if (matches(header, "答案", "正确答案", "answer")) {
                cols.put("answer", i);
            } else if (matches(header, "分值", "分数", "score")) {
                cols.put("score", i);
            } else if (matches(header, "解析", "分析", "analysis")) {
                cols.put("analysis", i);
            }
        }
        return cols;
    }

    private Question parseRow(Row row, Map<String, Integer> cols, int rowNum) {
        Question q = new Question();

        String stem = cellStr(row, cols.get("stem"));
        if (stem.isBlank()) return null;
        q.setStem(stem.trim());

        // Parse type
        String typeStr = cellStr(row, cols.get("type")).trim();
        q.setType(parseType(typeStr));

        // Parse options
        List<String> options = new ArrayList<>();
        for (String key : List.of("A", "B", "C", "D")) {
            Integer col = cols.get(key);
            if (col != null) {
                String opt = cellStr(row, col).trim();
                if (!opt.isBlank()) {
                    options.add(key + ". " + opt);
                }
            }
        }
        if (!options.isEmpty()) {
            q.setOptionsJson(toJson(options));
        }

        q.setAnswer(cellStr(row, cols.get("answer")).trim());
        q.setAnalysis(cellStr(row, cols.get("analysis")).trim());

        String scoreStr = cellStr(row, cols.get("score")).trim();
        if (!scoreStr.isBlank()) {
            try {
                q.setScore((int) Double.parseDouble(scoreStr));
            } catch (NumberFormatException e) {
                q.setScore(1);
            }
        }

        return q;
    }

    static QuestionType parseType(String s) {
        if (s == null || s.isBlank()) return QuestionType.SINGLE;
        s = s.toLowerCase();
        if (s.contains("多选")) return QuestionType.MULTI;
        if (s.contains("判断") || s.contains("对错")) return QuestionType.JUDGE;
        if (s.contains("填空")) return QuestionType.FILL;
        if (s.contains("简答") || s.contains("问答") || s.contains("论述")) return QuestionType.ESSAY;
        return QuestionType.SINGLE;
    }

    private static boolean matches(String header, String... keywords) {
        for (String kw : keywords) {
            if (header.equals(kw) || header.startsWith(kw) || header.endsWith(kw)) return true;
        }
        return false;
    }

    private static String cellStr(Row row, Integer col) {
        if (col == null) return "";
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double v = cell.getNumericCellValue();
                yield v == Math.floor(v) ? String.valueOf((long) v) : String.valueOf(v);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    static String toJson(List<String> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append('"').append(list.get(i).replace("\\", "\\\\").replace("\"", "\\\"")).append('"');
        }
        sb.append("]");
        return sb.toString();
    }
}
