pipeline {
    agent any

    stages {
        stage('Clonar Repositorio') {
            steps {
                git 'https://github.com/tuusuario/tu-repo.git'
            }
        }

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
