package com.damo.partyschool.partydues;

import com.damo.partyschool.auth.AuthException;
import com.damo.partyschool.auth.UserPrincipal;
import com.damo.partyschool.common.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/party-dues")
public class PartyDuesController {

    private final PartyDuesService partyDuesService;

    public PartyDuesController(PartyDuesService partyDuesService) {
        this.partyDuesService = partyDuesService;
    }

    @PostMapping("/standards")
    public ApiResponse<PartyDuesStandardView> createStandard(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PartyDuesStandardRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(partyDuesService.createStandard(principal, request));
    }

    @PostMapping("/standards/batch")
    public ApiResponse<PartyDuesImportResult> importStandards(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        requireAuth(principal);
        return ApiResponse.ok(partyDuesService.importStandards(principal, file));
    }

    @GetMapping("/standards")
    public ApiResponse<List<PartyDuesStandardView>> listStandards(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long branchId) {
        requireAuth(principal);
        return ApiResponse.ok(partyDuesService.listStandards(principal, branchId));
    }

    @PutMapping("/standards/{id}")
    public ApiResponse<PartyDuesStandardView> updateStandard(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody PartyDuesStandardRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(partyDuesService.updateStandard(principal, id, request));
    }

    @PostMapping("/generate")
    public ApiResponse<List<PartyDuesRecordView>> generate(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String yearMonth) {
        requireAuth(principal);
        return ApiResponse.ok(partyDuesService.generateRecords(principal, yearMonth));
    }

    @GetMapping("/records")
    public ApiResponse<List<PartyDuesRecordView>> records(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String yearMonth,
            @RequestParam(required = false) String status) {
        requireAuth(principal);
        PartyDuesRecordStatus recordStatus = null;
        if (status != null && !status.isBlank()) {
            recordStatus = PartyDuesRecordStatus.valueOf(status.toUpperCase());
        }
        return ApiResponse.ok(partyDuesService.listRecords(principal, branchId, yearMonth, recordStatus));
    }

    @PutMapping("/records/{id}/pay")
    public ApiResponse<PartyDuesRecordView> pay(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody PartyDuesPayRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(partyDuesService.markPaid(principal, id, request));
    }

    @PostMapping("/records/batch-pay")
    public ApiResponse<List<PartyDuesRecordView>> batchPay(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PartyDuesBatchPayRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(partyDuesService.batchMarkPaid(principal, request));
    }

    @PostMapping("/records/{id}/remind")
    public ApiResponse<PartyDuesRecordView> remind(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        requireAuth(principal);
        return ApiResponse.ok(partyDuesService.remind(principal, id));
    }

    @PostMapping("/records/batch-remind")
    public ApiResponse<List<PartyDuesRecordView>> batchRemind(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PartyDuesBatchRemindRequest request) {
        requireAuth(principal);
        return ApiResponse.ok(partyDuesService.batchRemind(principal, request));
    }

    @GetMapping("/stats")
    public ApiResponse<PartyDuesStatsView> stats(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String yearMonth) {
        requireAuth(principal);
        return ApiResponse.ok(partyDuesService.stats(principal, yearMonth));
    }

    @GetMapping("/my-records")
    public ApiResponse<List<PartyDuesRecordView>> myRecords(
            @AuthenticationPrincipal UserPrincipal principal) {
        requireAuth(principal);
        return ApiResponse.ok(partyDuesService.myRecords(principal));
    }

    private void requireAuth(UserPrincipal principal) {
        if (principal == null) {
            throw new AuthException("Unauthorized");
        }
    }
}
