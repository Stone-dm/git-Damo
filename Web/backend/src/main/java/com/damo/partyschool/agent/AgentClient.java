package com.damo.partyschool.agent;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class AgentClient {

    private final RestClient restClient;

    public AgentClient(@Qualifier("agentRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public void ingest(IngestPayload payload) {
        try {
            restClient.post()
                    .uri("/ingest")
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            throw new AgentUnavailableException("智能体服务暂不可用", ex);
        }
    }

    public RecommendResponse recommend(RecommendPayload payload) {
        try {
            RecommendResponse response = restClient.post()
                    .uri("/recommend")
                    .body(payload)
                    .retrieve()
                    .body(RecommendResponse.class);
            return response != null ? response : new RecommendResponse(java.util.List.of());
        } catch (RestClientException ex) {
            throw new AgentUnavailableException("智能体服务暂不可用", ex);
        }
    }

    public ChatResponse chat(ChatPayload payload) {
        try {
            ChatResponse response = restClient.post()
                    .uri("/chat")
                    .body(payload)
                    .retrieve()
                    .body(ChatResponse.class);
            return response != null ? response : new ChatResponse("");
        } catch (RestClientException ex) {
            throw new AgentUnavailableException("智能体服务暂不可用", ex);
        }
    }
}
