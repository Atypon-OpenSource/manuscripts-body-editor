pipeline {
    agent {
        docker {
            image 'node:18'
            args '--userns=host \
                  -v /home/ci/.cache/yarn:/.cache/yarn'
        }
    }
    stages {
        stage('Build') {
            steps {
                sh 'node -v'
                sh 'yarn install --non-interactive --frozen-lockfile'
                sh 'yarn typecheck'
                sh 'yarn test'
                sh 'yarn build'
            }
        }
    }
}
