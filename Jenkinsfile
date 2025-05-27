pipeline {
    agent any

    stages {
        stage('Construir imagen Docker') {
            steps {
                script {
                    docker.build('mi-app')
                }
            }
        }

        stage('Levantar contenedor') {
            steps {
                sh 'docker-compose up -d'
            }
        }
    }
}
