package com.damo.partyschool.question;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final ExcelQuestionParser excelParser;
    private final WordQuestionParser wordParser;

    public QuestionService(QuestionRepository questionRepository,
            ExcelQuestionParser excelParser, WordQuestionParser wordParser) {
        this.questionRepository = questionRepository;
        this.excelParser = excelParser;
        this.wordParser = wordParser;
    }

    @Transactional(readOnly = true)
    public List<QuestionView> listAll() {
        return questionRepository.findAllByOrderByOrderNum()
                .stream().map(QuestionView::from).toList();
    }

    @Transactional
    public QuestionView create(QuestionView dto) {
        Question q = new Question();
        apply(q, dto);
        q = questionRepository.save(q);
        return QuestionView.from(q);
    }

    @Transactional
    public QuestionView update(Long id, QuestionView dto) {
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("题目不存在"));
        apply(q, dto);
        q = questionRepository.save(q);
        return QuestionView.from(q);
    }

    private void apply(Question q, QuestionView dto) {
        q.setStem(dto.stem());
        q.setType(dto.type());
        q.setOptionsJson(dto.optionsJson());
        q.setAnswer(dto.answer());
        q.setAnalysis(dto.analysis());
        q.setScore(dto.score());
        q.setOrderNum(dto.orderNum());
    }

    @Transactional
    public void delete(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new IllegalArgumentException("题目不存在");
        }
        questionRepository.deleteById(id);
    }

    @Transactional
    public QuestionImportResult importFile(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            return new QuestionImportResult(0, List.of("文件名为空"), List.of());
        }

        try {
            List<Question> parsed;
            List<String> errors;
            if (filename.toLowerCase().endsWith(".xlsx") || filename.toLowerCase().endsWith(".xls")) {
                var result = excelParser.parse(file.getInputStream());
                parsed = result.questions();
                errors = result.errors();
            } else if (filename.toLowerCase().endsWith(".docx")) {
                var result = wordParser.parse(file.getInputStream());
                parsed = result.questions();
                errors = result.errors();
            } else {
                return new QuestionImportResult(0,
                        List.of("不支持的文件格式: " + filename + "，请使用 .xlsx 或 .docx"),
                        List.of());
            }

            List<QuestionView> saved = new ArrayList<>();
            for (Question q : parsed) {
                saved.add(QuestionView.from(questionRepository.save(q)));
            }

            return new QuestionImportResult(saved.size(), errors, saved);
        } catch (Exception e) {
            return new QuestionImportResult(0,
                    List.of("文件解析失败: " + e.getMessage()),
                    List.of());
        }
    }
}
