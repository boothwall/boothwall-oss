/** Opaque host authority: the core never interprets the actor behind a lease. */
export type ControlLease = {
  id: string;
  admissionExpiresAt: number;
  connectionExpiresAt: number;
};

/** Keep a revoked ticket fenced through its last possible admission. */
export type ControlLeaseRevocation = Pick<ControlLease, "id" | "admissionExpiresAt">;
