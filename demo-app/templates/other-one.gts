import { LinkTo } from '@ember/routing';

<template>
  <p data-test-other-route>This is the other route.</p>
  <LinkTo @route="error-maker" data-test-link="error-maker">And back again</LinkTo>
</template>
