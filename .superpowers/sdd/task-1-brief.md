### Task 1: 鍩虹璁炬柦 鈥?docker-compose锛圡ySQL + Milvus锛?

**Files:**
- Create: `Web/docker-compose.yml`
- Create: `Web/.env.example`
- Create: `Web/README.md`锛堝厛鍐欏熀纭€璁炬柦灏忚妭锛屽悗缁换鍔¤拷鍔狅級

**Interfaces:**
- Produces: MySQL `localhost:3306`锛堝簱鍚?`party_school`锛岀敤鎴?瀵嗙爜瑙?`.env.example`锛夛紱Milvus `localhost:19530`

- [ ] **Step 1: 鍒涘缓 `Web/docker-compose.yml`**

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: party-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: party_school
      MYSQL_USER: party
      MYSQL_PASSWORD: party123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 5s
      retries: 20

  etcd:
    image: quay.io/coreos/etcd:v3.5.5
    container_name: party-etcd
    environment:
      ETCD_AUTO_COMPACTION_MODE: revision
      ETCD_AUTO_COMPACTION_RETENTION: "1000"
      ETCD_QUOTA_BACKEND_BYTES: "4294967296"
      ETCD_SNAPSHOT_COUNT: "50000"
    command: etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd
    volumes:
      - etcd_data:/etcd

  minio:
    image: minio/minio:RELEASE.2023-03-20T20-16-18Z
    container_name: party-minio
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    command: minio server /minio_data --console-address ":9001"
    volumes:
      - minio_data:/minio_data
    ports:
      - "9001:9001"

  milvus:
    image: milvusdb/milvus:v2.3.4
    container_name: party-milvus
    command: ["milvus", "run", "standalone"]
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    volumes:
      - milvus_data:/var/lib/milvus
    ports:
      - "19530:19530"
      - "9091:9091"
    depends_on:
      - etcd
      - minio

volumes:
  mysql_data:
  etcd_data:
  minio_data:
  milvus_data:
```

- [ ] **Step 2: 鍒涘缓 `Web/.env.example`**

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=party_school
MYSQL_USER=party
MYSQL_PASSWORD=party123

MILVUS_HOST=localhost
MILVUS_PORT=19530

DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
EMBEDDING_API_KEY=
EMBEDDING_BASE_URL=
EMBEDDING_MODEL=text-embedding-3-small

JWT_SECRET=change-me-to-a-long-random-string
AGENT_BASE_URL=http://localhost:8000
BACKEND_BASE_URL=http://localhost:8080
```

- [ ] **Step 3: 鍐?README 鍩虹璁炬柦鑺?*

鍦?`Web/README.md` 鍐欙細濡備綍 `docker compose up -d`銆佺瓑寰?MySQL healthy銆侀粯璁よ处鍙峰瘑鐮佽〃锛堝悗缁?DataSeeder 璐﹀彿涔熷啓杩欓噷锛夈€?

- [ ] **Step 4: 鍚姩骞堕獙璇?*

```bash
cd Web
docker compose up -d
docker compose ps
```

Expected: `mysql`銆乣milvus`銆乣etcd`銆乣minio` 鍧囦负 running锛堟垨 milvus healthy锛夈€?

- [ ] **Step 5: Commit**

```bash
git add Web/docker-compose.yml Web/.env.example Web/README.md
git commit -m "chore: add MySQL and Milvus docker-compose for Web scaffold"
```

---


