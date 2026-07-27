package com.damo.partyschool.partydues;

import java.util.List;

public record PartyDuesImportResult(int importedCount, List<String> errors, List<PartyDuesStandardView> standards) {}
