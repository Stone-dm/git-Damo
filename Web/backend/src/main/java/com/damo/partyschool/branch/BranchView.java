package com.damo.partyschool.branch;

public record BranchView(Long id, String name, String description) {

    public static BranchView from(Branch branch) {
        return new BranchView(branch.getId(), branch.getName(), branch.getDescription());
    }
}
