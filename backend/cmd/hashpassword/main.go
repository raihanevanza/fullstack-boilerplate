// Command hashpassword prints a bcrypt hash for dbo.Users.PasswordHash.
//
//	go run ./cmd/hashpassword 'NewPassword123!'
package main

import (
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	if len(os.Args) != 2 || os.Args[1] == "" {
		fmt.Fprintln(os.Stderr, "usage: go run ./cmd/hashpassword <password>")
		os.Exit(2)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(os.Args[1]), bcrypt.DefaultCost)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	fmt.Println(string(hash))
}
