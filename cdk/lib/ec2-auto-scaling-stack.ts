import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvValues } from './env/EnvValues';
import { Network } from './construct/network';
import { AppSecurityGroup } from './construct/app-security-group';
import { AutoScaling } from './construct/auto-scaling';

export interface Ec2AutoScalingStackProps extends cdk.StackProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class Ec2AutoScalingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Ec2AutoScalingStackProps) {
    super(scope, id, props);

    const { namePrefix, envValues } = props;

    // VPCの作成
    const network = new Network(this, 'Network', {
      namePrefix,
      envValues,
    });

    // セキュリティグループの作成
    const securityGroup = new AppSecurityGroup(this, 'SecurityGroup', {
      namePrefix,
      envValues,
      vpc: network.vpc,
    });

    // オートスケーリングの作成
    new AutoScaling(this, 'AutoScaling', {
      namePrefix,
      envValues,
      securityGroup: securityGroup.ec2SecurityGroup,
      vpc: network.vpc,
    });
  }
}
