import { Construct } from 'constructs';
import { ISecurityGroup, IVpc, Peer, Port } from 'aws-cdk-lib/aws-ec2';
import { BaseSecurityGroup } from '../base/base-security-group';
import { EnvValues } from '../env/EnvValues';

export class AppSecurityGroupProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
  readonly vpc: IVpc;
}

export class AppSecurityGroup extends Construct {
  public readonly ec2SecurityGroup: ISecurityGroup;

  constructor(scope: Construct, id: string, props: AppSecurityGroupProps) {
    super(scope, id);

    const { namePrefix, envValues, vpc } = props;

    // EC2のセキュリティグループを作成
    this.ec2SecurityGroup = this.createEc2SecurityGroup(namePrefix, envValues, vpc);
  }

  private createEc2SecurityGroup(
    namePrefix: string,
    envValues: EnvValues,
    vpc: IVpc,
  ): ISecurityGroup {
    const sg = new BaseSecurityGroup(this, 'ec2', {
      securityGroupName: `${namePrefix}-ec2-sg`,
      vpc: vpc,
      description: 'EC2 Security Group',
    });

    envValues.allowedIngressIpV4CIDRs.forEach((cidr) => {
      sg.addIngressRule(Peer.ipv4(cidr), Port.tcp(22), 'Allow SSH from Specific IP');
    });

    return sg;
  }
}
