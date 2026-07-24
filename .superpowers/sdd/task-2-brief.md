### Task 2: Spring Boot 宸ョ▼楠ㄦ灦 + 缁熶竴鍝嶅簲/瀹夊叏閰嶇疆

**Files:**
- Create: `Web/backend/pom.xml`
- Create: `Web/backend/src/main/java/com/damo/partyschool/PartySchoolApplication.java`
- Create: `Web/backend/src/main/resources/application.yml`
- Create: `Web/backend/src/main/java/com/damo/partyschool/common/ApiResponse.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/common/GlobalExceptionHandler.java`
- Create: `Web/backend/src/main/java/com/damo/partyschool/config/CorsConfig.java`
- Test: `Web/backend/src/test/java/com/damo/partyschool/PartySchoolApplicationTests.java`

**Interfaces:**
- Produces: 鍙惎鍔ㄧ殑绌?Spring Boot 搴旂敤锛沗ApiResponse<T>` 褰㈢姸 `{ code, message, data }`

- [ ] **Step 1: 鍒涘缓 Maven `pom.xml`**

渚濊禆锛歚spring-boot-starter-web`銆乣spring-boot-starter-data-jpa`銆乣spring-boot-starter-security`銆乣spring-boot-starter-validation`銆乣mysql-connector-j`銆乣jjwt-api/impl/jackson`锛?.12.x锛夈€乣lombok`銆乣spring-boot-starter-test`銆乣spring-security-test`銆? 
Parent锛歚spring-boot-starter-parent` `3.2.5`锛孞ava 17銆?

- [ ] **Step 2: 搴旂敤鍏ュ彛涓?`application.yml`**

```yaml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://${MYSQL_HOST:localhost}:${MYSQL_PORT:3306}/${MYSQL_DB:party_school}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&characterEncoding=utf8
    username: ${MYSQL_USER:party}
    password: ${MYSQL_PASSWORD:party123}
  jpa:
    hibernate:
      ddl-auto: update
    open-in-view: false
    properties:
      hibernate.format_sql: true
app:
  jwt:
    secret: ${JWT_SECRET:change-me-to-a-long-random-string}
    expire-ms: 86400000
  agent:
    base-url: ${AGENT_BASE_URL:http://localhost:8000}
```

- [ ] **Step 3: `ApiResponse` + `GlobalExceptionHandler`**

```java
public record ApiResponse<T>(int code, String message, T data) {
  public static <T> ApiResponse<T> ok(T data) { return new ApiResponse<>(0, "ok", data); }
  public static ApiResponse<Void> ok() { return new ApiResponse<>(0, "ok", null); }
  public static ApiResponse<Void> fail(int code, String message) { return new ApiResponse<>(code, message, null); }
}
```

Handler 鏄犲皠锛歚IllegalArgumentException` 鈫?400锛沗AccessDeniedException` 鈫?403锛涘叾浣?鈫?500锛宐ody 鐢?`ApiResponse.fail`銆?

- [ ] **Step 4: CORS 鍏佽 `http://localhost:5173`**

- [ ] **Step 5: 杩愯涓婁笅鏂囧姞杞芥祴璇?*

```bash
cd Web/backend
mvn -q test -Dtest=PartySchoolApplicationTests
```

Expected: PASS锛堥渶 MySQL 宸插惎鍔紱鑻ユ祴璇曚笉鎯宠繛鐪熷疄搴擄紝鍙厛鐢?`@SpringBootTest` + 鐪熷疄 MySQL锛屾垨鏈换鍔℃殏鐢?`ddl-auto` 杩?docker MySQL锛夈€?

- [ ] **Step 6: Commit**

```bash
git add Web/backend
git commit -m "feat: scaffold Spring Boot backend with ApiResponse and CORS"
```

---


