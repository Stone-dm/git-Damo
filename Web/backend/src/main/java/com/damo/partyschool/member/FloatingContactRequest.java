package com.damo.partyschool.member;

import java.time.LocalDate;

public record FloatingContactRequest(
        LocalDate contactDate,
        String contactMethod,
        String summary) {
}
