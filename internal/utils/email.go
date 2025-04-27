package utils

import (
	"bytes"
	"fmt"
	"html/template"
	"os"

	"github.com/joho/godotenv"
	"gopkg.in/gomail.v2"
)

// Initialize environment variables
func init() {
	godotenv.Load()
}

// EmailConfig stores email configuration
type EmailConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	FromName string
	FromEmail string
}

// GetEmailConfig loads email configuration from environment variables
func GetEmailConfig() EmailConfig {
	port := 587 // Default SMTP port
	return EmailConfig{
		Host:     os.Getenv("SMTP_HOST"),
		Port:     port,
		Username: os.Getenv("SMTP_USERNAME"),
		Password: os.Getenv("SMTP_PASSWORD"),
		FromName: os.Getenv("EMAIL_FROM_NAME"),
		FromEmail: os.Getenv("EMAIL_FROM_ADDRESS"),
	}
}

// SendVerificationEmail sends a verification email to the user
func SendVerificationEmail(to, token, username string) error {
	config := GetEmailConfig()

	// Create new message
	m := gomail.NewMessage()
	m.SetHeader("From", fmt.Sprintf("%s <%s>", config.FromName, config.FromEmail))
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Verify Your Email Address")

	// Prepare email body using template
	body, err := parseVerificationTemplate(token, username)
	if err != nil {
		return err
	}

	m.SetBody("text/html", body)

	// Setup dialer with SMTP server details
	d := gomail.NewDialer(config.Host, config.Port, config.Username, config.Password)

	// Send email
	if err := d.DialAndSend(m); err != nil {
		return err
	}

	return nil
}

func parseVerificationTemplate(token, username string) (string, error) {
	baseURL := os.Getenv("FRONTEND_URL")
	if baseURL == "" {
		baseURL = "http://localhost:3000" // Update this to match your React app port
	}
	// Change this line: '/verify' to '/verify-email'
	verificationURL := fmt.Sprintf("%s/verify-email?token=%s", baseURL, token)

	// Email template as a string
	const emailTemplate = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="UTF-8">
		<title>Verify Your Email</title>
		<style>
			body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
			.container { background-color: #f7f8fa; border-radius: 5px; padding: 30px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
			.button { display: inline-block; background-color: #4754D2; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; }
			h1 { color: #222; margin-bottom: 20px; }
			.footer { margin-top: 30px; font-size: 12px; color: #777; }
		</style>
	</head>
	<body>
		<div class="container">
			<h1>Verify Your Email Address</h1>
			<p>Thank you for signing up! Please verify your email address to complete your registration.</p>
			<p><a href="{{.VerificationURL}}" class="button">Verify Email</a></p>
			<p>Or copy and paste this link into your browser:</p>
			<p>{{.VerificationURL}}</p>
			<p>This link will expire in 24 hours.</p>
			<div class="footer">
				<p>If you didn't create an account, you can safely ignore this email.</p>
			</div>
		</div>
	</body>
	</html>
	`

	// Create a template and parse the template string
	tmpl, err := template.New("verification_email").Parse(emailTemplate)
	if err != nil {
		return "", err
	}

	// Prepare data for template
	data := struct {
		Username        string
		VerificationURL string
	}{
		Username:        username,
		VerificationURL: verificationURL,
	}

	// Execute template with data
	var tpl bytes.Buffer
	if err := tmpl.Execute(&tpl, data); err != nil {
		return "", err
	}

	return tpl.String(), nil
}
