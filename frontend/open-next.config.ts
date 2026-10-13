import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext Cloudflare 어댑터 설정 (issue #146).
 * ISR·`use cache`를 쓰지 않으므로 증분 캐시(R2 등)는 두지 않는다. 쓰게 되면 여기서 override 를 추가한다.
 */
export default defineCloudflareConfig();
