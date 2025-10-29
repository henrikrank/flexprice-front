### Price Grouping Integration
I want to integrate price grouping in the system. Currently we only group prices for now.

### Below you can find API and DTO's of backend

- API routes
```		group := v1Private.Group("/groups")
		{
			group.POST("", handlers.Group.CreateGroup)
			group.POST("/search", handlers.Group.ListGroups)
			group.GET("/:id", handlers.Group.GetGroup)
			group.DELETE("/:id", handlers.Group.DeleteGroup)
		}
```

- Handlers
```
package v1

import (
	"net/http"

	"github.com/flexprice/flexprice/internal/api/dto"
	ierr "github.com/flexprice/flexprice/internal/errors"
	"github.com/flexprice/flexprice/internal/logger"
	"github.com/flexprice/flexprice/internal/service"
	"github.com/flexprice/flexprice/internal/types"
	"github.com/gin-gonic/gin"
)

type GroupHandler struct {
	service service.GroupService
	log     *logger.Logger
}

func NewGroupHandler(service service.GroupService, log *logger.Logger) *GroupHandler {
	return &GroupHandler{service: service, log: log}
}

// @Summary Create a group
// @Description Create a new group for organizing entities (prices, plans, customers, etc.)
// @Tags Groups
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param group body dto.CreateGroupRequest true "Group"
// @Success 201 {object} dto.GroupResponse
// @Failure 400 {object} ierr.ErrorResponse
// @Failure 500 {object} ierr.ErrorResponse
// @Router /groups [post]
func (h *GroupHandler) CreateGroup(c *gin.Context) {
	var req dto.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(ierr.WithError(err).
			WithHint("Invalid request format").
			Mark(ierr.ErrValidation))
		return
	}

	resp, err := h.service.CreateGroup(c.Request.Context(), req)
	if err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusCreated, resp)
}

// @Summary Get a group
// @Description Get a group by ID
// @Tags Groups
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Group ID"
// @Success 200 {object} dto.GroupResponse
// @Failure 400 {object} ierr.ErrorResponse
// @Failure 404 {object} ierr.ErrorResponse
// @Failure 500 {object} ierr.ErrorResponse
// @Router /groups/{id} [get]
func (h *GroupHandler) GetGroup(c *gin.Context) {
	id := c.Param("id")

	resp, err := h.service.GetGroup(c.Request.Context(), id)
	if err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, resp)
}

// @Summary Delete a group
// @Description Delete a group and remove all entity associations
// @Tags Groups
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Group ID"
// @Success 204 "No Content"
// @Failure 400 {object} ierr.ErrorResponse
// @Failure 404 {object} ierr.ErrorResponse
// @Failure 500 {object} ierr.ErrorResponse
// @Router /groups/{id} [delete]
func (h *GroupHandler) DeleteGroup(c *gin.Context) {
	id := c.Param("id")

	err := h.service.DeleteGroup(c.Request.Context(), id)
	if err != nil {
		c.Error(err)
		return
	}

	c.Status(http.StatusOK)
}

// @Summary Get groups
// @Description Get groups with optional filtering via query parameters
// @Tags Groups
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param entity_type query string false "Filter by entity type (e.g., 'price')"
// @Param name query string false "Filter by group name (contains search)"
// @Param lookup_key query string false "Filter by lookup key (exact match)"
// @Param limit query int false "Number of items to return (default: 20)"
// @Param offset query int false "Number of items to skip (default: 0)"
// @Param sort_by query string false "Field to sort by (name, created_at, updated_at)"
// @Param sort_order query string false "Sort order (asc, desc)"
// @Success 200 {object} dto.ListGroupsResponse
// @Failure 400 {object} ierr.ErrorResponse
// @Failure 500 {object} ierr.ErrorResponse
// @Router /groups/search [post]
func (h *GroupHandler) ListGroups(c *gin.Context) {
	var filter types.GroupFilter
	if err := c.ShouldBindJSON(&filter); err != nil {
		c.Error(ierr.WithError(err).
			WithHint("Invalid filter parameters").
			Mark(ierr.ErrValidation))
		return
	}

	if err := filter.Validate(); err != nil {
		c.Error(ierr.WithError(err).
			WithHint("Invalid filter parameters").
			Mark(ierr.ErrValidation))
		return
	}

	if filter.GetLimit() == 0 {
		filter.QueryFilter = types.NewDefaultQueryFilter()
	}

	resp, err := h.service.ListGroups(c.Request.Context(), &filter)
	if err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, resp)
}

```

- DTOs
```
package dto

import (
	"context"
	"time"

	"github.com/flexprice/flexprice/internal/domain/group"
	"github.com/flexprice/flexprice/internal/types"
	"github.com/flexprice/flexprice/internal/validator"
)

// CreateGroupRequest represents the request to create a group
type CreateGroupRequest struct {
	Name       string `json:"name" validate:"required"`
	EntityType string `json:"entity_type" validate:"required"`
	LookupKey  string `json:"lookup_key" validate:"required"`
}

func (r *CreateGroupRequest) Validate() error {
	if err := validator.ValidateRequest(r); err != nil {
		return err
	}

	// Validate entity type
	entityType := types.GroupEntityType(r.EntityType)
	if err := entityType.Validate(); err != nil {
		return err
	}

	return nil
}

func (r *CreateGroupRequest) ToGroup(ctx context.Context) (*group.Group, error) {
	entityType := types.GroupEntityType(r.EntityType)
	return &group.Group{
		ID:            types.GenerateUUIDWithPrefix(types.UUID_PREFIX_GROUP),
		Name:          r.Name,
		EntityType:    entityType,
		EnvironmentID: types.GetEnvironmentID(ctx),
		LookupKey:     r.LookupKey,
		BaseModel:     types.GetDefaultBaseModel(ctx),
	}, nil
}

// AddEntityToGroupRequest represents the request to add an entity to a group
type AddEntityToGroupRequest struct {
	EntityIDs []string `json:"entity_ids" validate:"required"`
}

func (r *AddEntityToGroupRequest) Validate() error {
	if err := validator.ValidateRequest(r); err != nil {
		return err
	}

	return nil
}

// GroupResponse represents the group response
type GroupResponse struct {
	ID         string            `json:"id"`
	Name       string            `json:"name"`
	LookupKey  string            `json:"lookup_key"`
	EntityType string            `json:"entity_type"`
	EntityIDs  []string          `json:"entity_ids"`
	Status     string            `json:"status"`
	Metadata   map[string]string `json:"metadata"`
	CreatedAt  time.Time         `json:"created_at"`
	UpdatedAt  time.Time         `json:"updated_at"`
}

// ListGroupsResponse represents the response for listing groups
type ListGroupsResponse = types.ListResponse[*GroupResponse]

func ToGroupResponse(group *group.Group) *GroupResponse {
	return &GroupResponse{
		ID:         group.ID,
		Name:       group.Name,
		LookupKey:  group.LookupKey,
		EntityType: string(group.EntityType),
		EntityIDs:  []string{},
		Status:     string(group.Status),
		Metadata:   group.Metadata,
		CreatedAt:  group.CreatedAt,
		UpdatedAt:  group.UpdatedAt,
	}
}

func ToGroupResponseWithEntities(group *group.Group, entityIDs []string) *GroupResponse {
	return &GroupResponse{
		ID:         group.ID,
		Name:       group.Name,
		LookupKey:  group.LookupKey,
		EntityType: string(group.EntityType),
		EntityIDs:  entityIDs,
		Status:     string(group.Status),
		Metadata:   group.Metadata,
		CreatedAt:  group.CreatedAt,
		UpdatedAt:  group.UpdatedAt,
	}
}
```

### User workflow
- There should be a separate pages for groups where you can create a group. It should be a listing page which will open a side drawer
- When setting up prices or updating prices you should give option to select groups by listing