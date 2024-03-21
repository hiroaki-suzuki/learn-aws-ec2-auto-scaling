import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvValues } from './env/EnvValues';
import { Network } from './construct/network';
import { AppSecurityGroup } from './construct/app-security-group';

export interface Ec2AutoScalingStackProps extends cdk.StackProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class Ec2AutoScalingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Ec2AutoScalingStackProps) {
    super(scope, id, props);

    const { namePrefix, envValues } = props;

    const network = new Network(this, 'Network', {
      namePrefix,
      envValues,
    });

    new AppSecurityGroup(this, 'SecurityGroup', {
      namePrefix,
      envValues,
      vpc: network.vpc,
    });
  }
}
