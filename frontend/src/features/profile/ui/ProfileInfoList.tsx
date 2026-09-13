import styles from "./css/ProfileInfoList.module.css";

export interface ProfileInfoRow {
  label: string;
  value: string;
}

export interface ProfileInfoListProps {
  rows: readonly ProfileInfoRow[];
}

/**
 * 프로필 정보 리스트 (features/profile 조각).
 *
 * 라벨↔값 행 목록. 지금은 정적 placeholder 를 받아 렌더하지만,
 * 추후 서버에서 fetch 한 실제 프로필 데이터를 이 슬라이스(api/model)에서 준비해 주입한다.
 */
export function ProfileInfoList({ rows }: ProfileInfoListProps) {
  return (
    <dl className={styles.list}>
      {rows.map((row) => (
        <div
          key={row.label}
          className={styles.row}
        >
          <dt className="text-sm text-text-muted">{row.label}</dt>
          <dd className="text-sm font-semibold text-text-strong">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
