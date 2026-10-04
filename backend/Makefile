-include .env
export

DOCKER_VERSION ?= 1.0.0
SERVICE_NAME ?= boilerplate-backend

# Tool versions are pinned and run through `go run`, so nothing has to be
# installed globally.
SWAG    := go run github.com/swaggo/swag/cmd/swag@v1.16.3
MOCKGEN := go run go.uber.org/mock/mockgen@v0.4.0

.PHONY: run build test cover vet fmt tidy swag mock docker-build

run:
	go run .

build:
	go build -o ./tmp/$(SERVICE_NAME) .

test:
	go test ./...

cover:
	mkdir -p tmp
	go test -coverprofile ./tmp/cover.out ./...
	go tool cover -func ./tmp/cover.out

vet:
	go vet ./...

fmt:
	gofmt -l -w .

tidy:
	go mod tidy

swag:
	$(SWAG) fmt -d . -g server.go
	$(SWAG) init -d . -g server.go -o ./docs --parseInternal

# One mock file per interface file in pkg/usecase and pkg/repository.
MOCK_SOURCES := $(filter-out %_test.go,$(wildcard pkg/usecase/*.go pkg/repository/*.go))

mock:
	rm -rf mock/usecase mock/repository
	@for src in $(MOCK_SOURCES); do \
		dir=$$(basename $$(dirname $$src)); \
		echo "mockgen $$src"; \
		$(MOCKGEN) -source=$$src -destination=mock/$$dir/$$(basename $$src) -package=mock_$$dir || exit 1; \
	done

docker-build:
	docker build --tag $(SERVICE_NAME):$(DOCKER_VERSION) .
