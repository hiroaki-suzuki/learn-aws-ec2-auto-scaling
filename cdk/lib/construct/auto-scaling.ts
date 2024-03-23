import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {
  InstanceClass,
  InstanceSize,
  ISecurityGroup,
  IVpc,
  LaunchTemplate,
  MachineImage,
} from 'aws-cdk-lib/aws-ec2';
import { IRole, ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { AutoScalingGroup, IAutoScalingGroup, Schedule } from 'aws-cdk-lib/aws-autoscaling';
import { Tags } from 'aws-cdk-lib';
import { EnvValues } from '../env/EnvValues';

export interface AutoScalingProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
  readonly securityGroup: ISecurityGroup;
  readonly vpc: IVpc;
}

export class AutoScaling extends Construct {
  constructor(scope: Construct, id: string, props: AutoScalingProps) {
    super(scope, id);

    const { namePrefix, envValues, securityGroup, vpc } = props;

    // ロールの作成
    const role = this.createRole(namePrefix);
    // ランチテンプレートの作成
    const launchTemplate = this.createLaunchTemplate(namePrefix, role, securityGroup);
    // オートスケーリンググループの作成
    const autoScalingGroup = this.createAutoScalingGroup(
      namePrefix,
      envValues,
      launchTemplate,
      vpc,
    );
    // 立ち上がるEC2の名前を設定
    this.setEc2Name(namePrefix, autoScalingGroup);
  }

  private createRole(namePrefix: string): IRole {
    // インスタンスコネクトでの接続に必要な権限を持つロールを作成
    return new Role(this, 'BastionEc2Role', {
      roleName: `${namePrefix}-bastion-ec2-role`,
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('EC2InstanceConnect')],
    });
  }

  private createLaunchTemplate(
    namePrefix: string,
    role: IRole,
    securityGroup: ISecurityGroup,
  ): LaunchTemplate {
    // ユーザーデータの設定、stressコマンドのインストールを行う
    const userData = ec2.UserData.forLinux({ shebang: '#!/bin/bash' });
    userData.addCommands('yum update -y', 'yum install -y stress');

    return new LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `${namePrefix}-launch-template`,
      instanceType: ec2.InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: MachineImage.latestAmazonLinux2023(),
      role,
      securityGroup,
      userData,
    });
  }

  private createAutoScalingGroup(
    namePrefix: string,
    envValues: EnvValues,
    launchTemplate: LaunchTemplate,
    vpc: IVpc,
  ): IAutoScalingGroup {
    const autoScalingGroup = new AutoScalingGroup(this, 'AutoScalingGroup', {
      autoScalingGroupName: `${namePrefix}-asg`,
      vpc,
      launchTemplate,
      minCapacity: 0,
      maxCapacity: 4,
    });

    // CPUでのスケーリング
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
    });

    // 予定されたスケーリング（毎分xx分に最小数2台に、xx分に0台にスケーリング）
    autoScalingGroup.scaleOnSchedule('ScheduleScalingStart', {
      timeZone: 'Asia/Tokyo',
      schedule: Schedule.expression(envValues.scaleSchedule1StartCron),
      minCapacity: 2,
      desiredCapacity: 2,
    });

    autoScalingGroup.scaleOnSchedule('ScheduleScalingEnd', {
      timeZone: 'Asia/Tokyo',
      schedule: Schedule.expression(envValues.scaleSchedule1EndCron),
      minCapacity: 0,
      desiredCapacity: 0,
    });

    // 予定されたスケーリング（xxxx年xx月xx日xx時xx分に最小数3台に、xx時xx分に0台にスケーリング）
    // endTimeを指定することで、スケジュールの終了日時を指定できる（１回で消える）
    autoScalingGroup.scaleOnSchedule('ScheduleScalingStartOnce', {
      timeZone: 'Asia/Tokyo',
      schedule: Schedule.expression(envValues.scaleSchedule2StartCron),
      endTime: new Date(envValues.scaleSchedule2StartDate),
      minCapacity: 3,
      desiredCapacity: 3,
    });

    autoScalingGroup.scaleOnSchedule('ScheduleScalingEndOnce', {
      timeZone: 'Asia/Tokyo',
      schedule: Schedule.expression(envValues.scaleSchedule2EndCron),
      endTime: new Date(envValues.scaleSchedule2EndDate),
      minCapacity: 0,
      desiredCapacity: 0,
    });

    return autoScalingGroup;
  }

  private setEc2Name(namePrefix: string, autoScalingGroup: IAutoScalingGroup): void {
    Tags.of(autoScalingGroup).add('Name', `${namePrefix}-ec2`);
  }
}
