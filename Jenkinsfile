pipeline{
    agent any
    stages{
        stage('Build'){
            steps{
                echo 'Etapa Buil no disponible.'
            }
        }
        stage('Test'){
            steps{
                echo 'Etapa Test no disponible.'
            }
        }
        stage('Deploy'){
            steps{
                sh "docker-compose down -v"
                sh "docker-compose up -d --build"
            }
        }
    }
}