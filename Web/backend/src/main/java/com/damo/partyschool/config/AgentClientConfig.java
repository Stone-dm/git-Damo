package com.damo.partyschool.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Configuration
public class AgentClientConfig {

    @Bean
    RestClient agentRestClient(
            @Value("${app.agent.base-url}") String baseUrl,
            @Value("${app.agent.shared-token:}") String sharedToken) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000);
        factory.setReadTimeout(10000);
        RestClient.Builder builder = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory);
        if (StringUtils.hasText(sharedToken)) {
            builder.defaultHeader("X-Agent-Token", sharedToken.trim());
        }
        return builder.build();
    }
}
