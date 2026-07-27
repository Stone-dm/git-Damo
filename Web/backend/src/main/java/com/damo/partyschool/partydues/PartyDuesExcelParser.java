package com.damo.partyschool.partydues;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

@Component
public class PartyDuesExcelParser {

    private final DataFormatter formatter = new DataFormatter();

    public record ParseResult(List<PartyDuesStandardRequest> standards, List<String> errors) {}

    public ParseResult parse(InputStream stream) {
        List<PartyDuesStandardRequest> standards = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(stream)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() < 2) {
                errors.add("Excel file must include a header row and at least one data row");
                return new ParseResult(standards, errors);
            }

            Map<String, Integer> cols = mapColumns(sheet.getRow(0));
            if (!cols.containsKey("userId")
                    || !cols.containsKey("memberType")
                    || !cols.containsKey("monthlyIncome")) {
                errors.add("Required columns: userId, memberType, monthlyIncome");
                return new ParseResult(standards, errors);
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    continue;
                }
                try {
                    PartyDuesStandardRequest request = parseRow(row, cols);
                    if (request != null) {
                        standards.add(request);
                    }
                } catch (Exception e) {
                    errors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            errors.add("Failed to read Excel file: " + e.getMessage());
        }

        return new ParseResult(standards, errors);
    }

    private Map<String, Integer> mapColumns(Row row) {
        Map<String, Integer> cols = new LinkedHashMap<>();
        if (row == null) {
            return cols;
        }
        for (int i = 0; i < row.getLastCellNum(); i++) {
            String header = cellStr(row.getCell(i)).trim().toLowerCase();
            if (matches(header, "userid", "user_id", "user id", "party member id", "member id", "党员id", "用户id")) {
                cols.put("userId", i);
            } else if (matches(header, "branchid", "branch_id", "branch id", "支部id")) {
                cols.put("branchId", i);
            } else if (matches(header, "membertype", "member_type", "member type", "类型", "党员类型")) {
                cols.put("memberType", i);
            } else if (matches(header, "monthlyincome", "monthly_income", "monthly income", "income", "月收入", "收入基数")) {
                cols.put("monthlyIncome", i);
            } else if (matches(header, "effectivedate", "effective_date", "effective date", "生效日期")) {
                cols.put("effectiveDate", i);
            } else if (matches(header, "status", "状态")) {
                cols.put("status", i);
            } else if (matches(header, "notes", "note", "备注")) {
                cols.put("notes", i);
            }
        }
        return cols;
    }

    private PartyDuesStandardRequest parseRow(Row row, Map<String, Integer> cols) {
        String userIdText = cellStr(row.getCell(cols.get("userId"))).trim();
        if (userIdText.isBlank()) {
            return null;
        }

        Long userId = Long.valueOf(stripDecimal(userIdText));
        Long branchId = null;
        if (cols.containsKey("branchId")) {
            String branchIdText = cellStr(row.getCell(cols.get("branchId"))).trim();
            if (!branchIdText.isBlank()) {
                branchId = Long.valueOf(stripDecimal(branchIdText));
            }
        }

        PartyDuesMemberType memberType = PartyDuesMemberType.valueOf(
                cellStr(row.getCell(cols.get("memberType"))).trim().toUpperCase());
        BigDecimal income = new BigDecimal(cellStr(row.getCell(cols.get("monthlyIncome"))).trim());

        LocalDate effectiveDate = null;
        if (cols.containsKey("effectiveDate")) {
            String value = cellStr(row.getCell(cols.get("effectiveDate"))).trim();
            if (!value.isBlank()) {
                effectiveDate = LocalDate.parse(value);
            }
        }

        PartyDuesStandardStatus status = null;
        if (cols.containsKey("status")) {
            String value = cellStr(row.getCell(cols.get("status"))).trim();
            if (!value.isBlank()) {
                status = PartyDuesStandardStatus.valueOf(value.toUpperCase());
            }
        }

        String notes = cols.containsKey("notes") ? cellStr(row.getCell(cols.get("notes"))).trim() : null;
        return new PartyDuesStandardRequest(userId, branchId, memberType, income, effectiveDate, status, notes);
    }

    private boolean matches(String header, String... names) {
        String compact = header.replace(" ", "").replace("-", "").replace("_", "");
        for (String name : names) {
            String normalized = name.toLowerCase().replace(" ", "").replace("-", "").replace("_", "");
            if (compact.equals(normalized) || compact.contains(normalized)) {
                return true;
            }
        }
        return false;
    }

    private String cellStr(Cell cell) {
        return cell == null ? "" : formatter.formatCellValue(cell);
    }

    private String stripDecimal(String value) {
        if (value.endsWith(".0")) {
            return value.substring(0, value.length() - 2);
        }
        return value;
    }
}
