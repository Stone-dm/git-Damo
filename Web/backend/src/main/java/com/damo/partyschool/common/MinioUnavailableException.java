package com.damo.partyschool.common;

/**
 * MinIO 服务不可用时抛出。
 */
public class MinioUnavailableException extends RuntimeException {

    public MinioUnavailableException(String message) {
        super(message);
    }
}
