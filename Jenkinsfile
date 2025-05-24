pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.yml' 
    }

    stages {
        stage('Build') {
            steps {
                echo 'Ejecutando etapa Build...'

            }
        }

        stage('Test') {
            steps {
                echo 'Ejecutando etapa Test...'
c
            }
        }

        stage('Deploy') {
            steps {
                echo 'Ejecutando etapa Deploy...'
                sh 'which docker-compose || echo "docker-compose no está instalado"'
                sh 'docker-compose down -v'
                sh 'docker-compose up -d --build'
            }
        }
    }

    post {
        failure {
            echo 'La pipeline falló.'
        }
        success {
            echo 'Pipeline completada exitosamente.'
        }
    }
}
