job("[BE] Merge Request") {
    startOn {
        codeReviewOpened {
            branchToCheckout = CodeReviewBranch.MERGE_REQUEST_SOURCE
        }
        gitPush {
            anyRefMatching {
                +"refs/merge/*/head"
            }
        }
    }


    parallel {
        container(displayName = "build & test", image = "node:alpine") {

            cache {
                // package.json의 내용을 해시를 하고 그 값을 캐싱키로 사용
                // 이를 통해 package.json이 동일하면 캐시를 사용하도록 유도하고 달라지면 캐시를 새로 만든다
                // 참고: https://www.jetbrains.com/help/space/cache-files.html#upload-and-reuse-cached-files
                storeKey = "npm-{{ hashFiles('package.json') }}"

                // Fallback 옵션인데 불필요 할것 같아서 주석처리
                /*restoreKeys {
                    +"npm-master"
                }*/

                // 캐시가 들어갈 디렉토리
                localPath = "node_modules"
            }

            shellScript {
                content = """
                    set -e
                    npm install -g pnpm
                    if [ -z "${'$'}(ls -A node_modules)" ]; then
                        # 캐시 디렉토리가 비어있을때에만 pnpm install 실행
                        pnpm install
                    fi
                    pnpm build
                """
            }
        }

        container(displayName = "add reviewer", image = "node:alpine") {
            env["REVIEW_ID"] = "{{ run:review.id }}"
            env["PROJECT_ID"] = "{{ run:project.id }}"
            env["SPACE_AUTOMATION_AUTHORIZATION"] = "{{ project:SPACE_AUTOMATION_AUTHORIZATION }}"

            cache {
                storeKey = "npm-{{ hashFiles('package.json') }}"
                localPath = "node_modules"
            }

            shellScript {
                content = """
                    set -e
                    npm install -g pnpm
                    if [ -z "${'$'}(ls -A node_modules)" ]; then
                        # 캐시 디렉토리가 비어있을때에만 pnpm install 실행
                        pnpm install
                    fi
                    pnpm reviewer
                """
            }
        }
        container(displayName = "send automation result", image = "gradle:6.1.1-jre11") {
            env["REVIEW_ID"] = "{{ run:review.id }}"
            kotlinScript { api ->
                api.space().chats.messages.sendMessage(
                    channel = ChannelIdentifier.Review(ReviewIdentifier.Id(System.getenv("REVIEW_ID"))),
                    content = ChatMessage.Text(
                        text = api.executionUrl()
                    )
                )
            }
        }
    }
}

job("[BE] Deploy Develop") {
    startOn {
        gitPush {
            anyBranchMatching {
                +"develop"
            }
        }
    }

    git {
        refSpec {
            +"refs/heads/develop"
        }
        depth = UNLIMITED_DEPTH
    }

    container(displayName = "Push heroku remote", image = "alpine:3.18") {

        env["HEROKU_API_KEY"] = "{{ project:HEROKU_API_KEY }}"

        shellScript {
            content = """
                apk update
                apk add git
                echo "Git Version:"
                git --version

                git switch develop
                echo "Git Status:"
                git status

                git remote add heroku https://token:${'$'}HEROKU_API_KEY@git.heroku.com/bi-telescope-api.git
                git fetch --all --unshallow
                git push heroku develop:main -f
            """
        }
    }
}
