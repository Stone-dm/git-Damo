package com.damo.partyschool.question;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.damo.partyschool.common.ApiResponse;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping
    public ApiResponse<List<QuestionView>> list() {
        return ApiResponse.ok(questionService.listAll());
    }

    @PostMapping
    public ApiResponse<QuestionView> create(@RequestBody QuestionView dto) {
        return ApiResponse.ok(questionService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<QuestionView> update(@PathVariable Long id, @RequestBody QuestionView dto) {
        return ApiResponse.ok(questionService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        questionService.delete(id);
        return ApiResponse.ok();
    }

    @PostMapping("/import")
    public ApiResponse<QuestionImportResult> importFile(
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(questionService.importFile(file));
    }
}
