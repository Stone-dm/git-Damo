package com.damo.partyschool.question;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class WordQuestionParser {

    private static final Logger log = LoggerFactory.getLogger(WordQuestionParser.class);

    // Numbered question: "1.", "1、", "（1）", etc.
    private static final Pattern QUESTION_START = Pattern.compile("^[（(]?\\d+[)）.、.]\\s*");

    // Option: "A.", "A、", etc.
    private static final Pattern OPTION = Pattern.compile("^[A-D][.、）)]\\s*");

    // Answer marker: "答案：", "答案:", etc.
    private static final Pattern ANSWER = Pattern.compile("^答案[：:]\\s*");

    record ParseResult(List<Question> questions, List<String> errors) {}

    public ParseResult parse(InputStream stream) {
        List<Question> questions = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (XWPFDocument doc = new XWPFDocument(stream)) {
            List<XWPFParagraph> paragraphs = doc.getParagraphs();

            List<String> lines = new ArrayList<>();
            for (XWPFParagraph p : paragraphs) {
                String text = p.getText().trim();
                if (!text.isBlank()) {
                    lines.add(text);
                }
            }

            if (lines.isEmpty()) {
                errors.add("Word 文档为空");
                return new ParseResult(questions, errors);
            }

            List<List<String>> blocks = splitBlocks(lines);
            for (int i = 0; i < blocks.size(); i++) {
                try {
                    Question q = parseBlock(blocks.get(i));
                    if (q != null && q.getStem() != null && !q.getStem().isBlank()) {
                        q.setOrderNum(i + 1);
                        questions.add(q);
                    }
                } catch (Exception e) {
                    errors.add("第" + (i + 1) + "题解析失败: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            errors.add("Word 文件读取失败: " + e.getMessage());
            log.error("Word parse error", e);
        }

        return new ParseResult(questions, errors);
    }

    /** Split paragraphs into question blocks by detecting numbering patterns. */
    private List<List<String>> splitBlocks(List<String> lines) {
        List<List<String>> blocks = new ArrayList<>();
        List<String> current = new ArrayList<>();

        for (String line : lines) {
            if (QUESTION_START.matcher(line).find() && !current.isEmpty()) {
                blocks.add(new ArrayList<>(current));
                current.clear();
            }
            current.add(line);
        }
        if (!current.isEmpty()) {
            blocks.add(current);
        }
        return blocks;
    }

    private Question parseBlock(List<String> lines) {
        if (lines.isEmpty()) return null;

        Question q = new Question();
        List<String> options = new ArrayList<>();
        StringBuilder stemBuilder = new StringBuilder();
        StringBuilder answerBuilder = new StringBuilder();
        StringBuilder analysisBuilder = new StringBuilder();
        boolean inOptions = false;
        boolean inAnswer = false;
        boolean inAnalysis = false;

        for (String line : lines) {
            String cleaned = QUESTION_START.matcher(line).replaceFirst("").trim();

            if (ANSWER.matcher(line).find()) {
                inAnswer = true;
                inOptions = false;
                inAnalysis = false;
                answerBuilder.append(ANSWER.matcher(line).replaceFirst("").trim());
                continue;
            }

            if (line.startsWith("解析：") || line.startsWith("解析:") || line.startsWith("分析：")) {
                inAnalysis = true;
                inAnswer = false;
                inOptions = false;
                analysisBuilder.append(line.replaceFirst("^[解析分]*[析析]?[：:]\\s*", ""));
                continue;
            }

            if (OPTION.matcher(line).find()) {
                inOptions = true;
                options.add(line.trim());
                continue;
            }

            if (inAnalysis) {
                analysisBuilder.append(cleaned).append("\n");
            } else if (inAnswer) {
                answerBuilder.append(cleaned);
            } else if (inOptions) {
                // continuation of last option
                if (!options.isEmpty()) {
                    options.set(options.size() - 1, options.get(options.size() - 1) + " " + cleaned);
                }
            } else {
                stemBuilder.append(cleaned).append("\n");
            }
        }

        q.setStem(stemBuilder.toString().trim());
        q.setAnswer(answerBuilder.toString().trim());

        if (!options.isEmpty()) {
            q.setOptionsJson(ExcelQuestionParser.toJson(options));
            // Detect type from options
            String ans = q.getAnswer();
            if (ans != null && ans.length() > 1 && !ans.equals("对") && !ans.equals("错")
                    && !ans.equals("√") && !ans.equals("×")) {
                q.setType(QuestionType.MULTI);
            } else {
                q.setType(QuestionType.SINGLE);
            }
        } else {
            // No options — maybe JUDGE or ESSAY
            String ans = q.getAnswer();
            if (ans != null && (ans.equals("对") || ans.equals("错") || ans.equals("√") || ans.equals("×")
                    || ans.equals("正确") || ans.equals("错误"))) {
                q.setType(QuestionType.JUDGE);
            } else if (q.getStem().contains("填空") || q.getStem().contains("___") || q.getStem().contains("____")) {
                q.setType(QuestionType.FILL);
            } else {
                q.setType(QuestionType.ESSAY);
            }
        }

        q.setAnalysis(analysisBuilder.toString().trim());
        if (q.getAnalysis().isBlank()) q.setAnalysis(null);
        q.setScore(1);

        return q;
    }
}
