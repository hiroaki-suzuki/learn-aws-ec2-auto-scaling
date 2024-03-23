#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Ec2AutoScalingStack } from '../lib/ec2-auto-scaling-stack';
import { EnvValues } from '../lib/env/EnvValues';
import { setRemovalPolicy } from '../lib/aspect/RemovalPolicySetter';
import { addCommonTags } from '../lib/aspect/CommonTagSetter';

const app = new cdk.App();

const projectName = app.node.tryGetContext('projectName');
const envKey = app.node.tryGetContext('environment');
const envValues: EnvValues = app.node.tryGetContext(envKey);
const namePrefix = `${projectName}-${envValues.env}`;

const stack = new Ec2AutoScalingStack(app, namePrefix, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
  namePrefix,
  envValues,
});

setRemovalPolicy(stack, cdk.RemovalPolicy.DESTROY);
addCommonTags(stack, { project: projectName, env: envValues.env });
