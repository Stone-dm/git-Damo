package com.damo.partyschool.branch;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BranchRequest(
        @NotBlank @Size(max = 128) String name,
        @Size(max = 512) String description) {
}
