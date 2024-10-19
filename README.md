# telescope/telescope-backend

telescope backend 개발을 위한 소스코드 입니다.

## marketplace link
telescope 는 [space marketplace](https://plugins.jetbrains.com/plugin/20332-telescope) 에서 설치해서 사용하실수 있습니다.


## 필요 사항

BE 실행을 위해 필요한 사항들 입니다.

* node.js 18 이상

## .env

환경 변수 적용을 위해 env 파일을 생성해야 합니다.
아래 링크를 참고하여 생성해 주시면 됩니다.

[참고 링크](https://beyond-imagination.jetbrains.space/p/telescope/documents/%EA%B5%AC%ED%98%84-%EB%AC%B8%EC%84%9C/a/env-%ED%8C%8C%EC%9D%BC)

## Getting Started

```shell
pnpm install
pnpm dev
```

## mongo db atlas

telescope 개발을 위해 mongo db atlas 를 사용합니다.

### 초대

초대를 못받았을 경우 프로젝트 관리자에게 요청 부탁드립니다.

### network access

mongo db atlas 에 접근하기 위해서 ip whitelist 가 필요합니다.
ip whitelist 는 atlas web ui 를 통해 직접 해주시면 됩니다.
