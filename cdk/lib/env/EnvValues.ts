export interface EnvValues {
  readonly env: Env;
  readonly vpcCidr: string;
  readonly allowedIngressIpV4CIDRs: string[];
  readonly scaleSchedule1StartCron: string;
  readonly scaleSchedule1EndCron: string;
  readonly scaleSchedule2StartCron: string;
  readonly scaleSchedule2StartDate: string;
  readonly scaleSchedule2EndCron: string;
  readonly scaleSchedule2EndDate: string;
}

export type Env = 'dev';
