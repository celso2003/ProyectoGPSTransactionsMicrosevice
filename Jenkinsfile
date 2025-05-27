pipeline {
    agent any

    stages {
        stage('Clonar Repositorio') {
            steps {
                git 'https://github.com/celso2003/ProyectoGPSInventorMicroservice.git'
            }
        }

        stage('Construir imagen Docker') {
            steps {
                script {
                    docker.build('gps-inventor-microservice')
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
