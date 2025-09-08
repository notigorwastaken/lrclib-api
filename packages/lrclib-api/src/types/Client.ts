type ClientOptions = {
  key?: string;
  url?: string;
};

type ChallengeResponse = {
  prefix: string;
  target: string;
};
export { ClientOptions, ChallengeResponse };
