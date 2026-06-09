package utils

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob/blob"
	"github.com/google/uuid"
)

var (
	azureClient             *azblob.Client
	containerName           string
	materialsContainerName  string
	accountName             string
)

func InitAzureBlob() {
	accountName = os.Getenv("AZURE_STORAGE_ACCOUNT")
	accountKey := os.Getenv("AZURE_STORAGE_KEY")
	containerName = os.Getenv("AZURE_CONTAINER_NAME")

	if accountName == "" || accountKey == "" {
		log.Println("Azure Storage credentials not fully set. Avatar upload will fail.")
		return
	}

	if containerName == "" {
		containerName = "avatars"
	}

	materialsContainerName = os.Getenv("AZURE_MATERIALS_CONTAINER_NAME")
	if materialsContainerName == "" {
		materialsContainerName = "materials"
	}

	cred, err := azblob.NewSharedKeyCredential(accountName, accountKey)
	if err != nil {
		log.Printf("Invalid Azure credentials: %v", err)
		return
	}

	serviceURL := fmt.Sprintf("https://%s.blob.core.windows.net/", accountName)
	client, err := azblob.NewClientWithSharedKeyCredential(serviceURL, cred, nil)
	if err != nil {
		log.Printf("Failed to create Azure Blob client: %v", err)
		return
	}

	azureClient = client
	log.Println("Azure Blob Storage initialized successfully.")
}

func UploadAvatar(file multipart.File, header *multipart.FileHeader) (string, error) {
	if azureClient == nil {
		return "", fmt.Errorf("azure client is not initialized")
	}

	// Read file into memory (or buffer)
	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, file); err != nil {
		return "", err
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	blobName := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)

	ctx := context.Background()
	
	contentType := header.Header.Get("Content-Type")
	
	_, err := azureClient.UploadBuffer(ctx, containerName, blobName, buf.Bytes(), &azblob.UploadBufferOptions{
		HTTPHeaders: &blob.HTTPHeaders{
			BlobContentType: &contentType,
		},
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload to Azure Blob: %v", err)
	}

	// Return public URL
	publicURL := fmt.Sprintf("https://%s.blob.core.windows.net/%s/%s", accountName, containerName, blobName)
	return publicURL, nil
}

func UploadMaterial(file multipart.File, teacherID string) (string, error) {
	if azureClient == nil {
		return "", fmt.Errorf("azure client is not initialized")
	}

	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, file); err != nil {
		return "", err
	}

	blobName := fmt.Sprintf("%s/%s.pdf", teacherID, uuid.New().String())
	ctx := context.Background()
	contentType := "application/pdf"

	_, err := azureClient.UploadBuffer(ctx, materialsContainerName, blobName, buf.Bytes(), &azblob.UploadBufferOptions{
		HTTPHeaders: &blob.HTTPHeaders{
			BlobContentType: &contentType,
		},
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload material to Azure Blob: %v", err)
	}

	publicURL := fmt.Sprintf("https://%s.blob.core.windows.net/%s/%s", accountName, materialsContainerName, blobName)
	return publicURL, nil
}

func DeleteMaterialBlob(fileURL string) error {
	if azureClient == nil {
		return fmt.Errorf("azure client is not initialized")
	}

	// URL format: https://<account>.blob.core.windows.net/<container>/<teacherID>/<uuid>.pdf
	// We need to extract the blobName which is "<teacherID>/<uuid>.pdf"
	prefix := fmt.Sprintf("https://%s.blob.core.windows.net/%s/", accountName, materialsContainerName)
	if len(fileURL) <= len(prefix) {
		return fmt.Errorf("invalid file URL format")
	}

	blobName := fileURL[len(prefix):]
	ctx := context.Background()

	_, err := azureClient.DeleteBlob(ctx, materialsContainerName, blobName, nil)
	return err
}
