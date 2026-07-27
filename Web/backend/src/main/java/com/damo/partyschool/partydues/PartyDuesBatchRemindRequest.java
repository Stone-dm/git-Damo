package com.damo.partyschool.partydues;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record PartyDuesBatchRemindRequest(@NotEmpty List<Long> recordIds) {}
