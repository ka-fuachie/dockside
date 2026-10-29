package sh.dockside.api.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/users")
@SecurityRequirement(name = "bearerAuth")
public class UserController {
  private final UserRepository users;
  private final PasswordEncoder passwordEncoder;

  public UserController(UserRepository users, PasswordEncoder passwordEncoder) {
    this.users = users;
    this.passwordEncoder = passwordEncoder;
  }

  private User currentUser() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    return users.findByUsername(auth.getName())
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "user not found"));
  }

  @GetMapping
  public Page<UserResponse> list(
    @RequestParam(required = false) String q,
    @RequestParam(required = false) String role,
    Pageable pageable
  ) {
    var roleFilter = role == null ? null : parseRole(role);
    var query = q == null || q.isBlank() ? null : q.toLowerCase();
    var page = pageable.getSort().isSorted() ? pageable
      : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.ASC, "id"));
    org.springframework.data.jpa.domain.Specification<User> spec = null;
    if (query != null) {
      org.springframework.data.jpa.domain.Specification<User> qSpec =
        (root, cq, cb) -> cb.like(cb.lower(root.get("username")), "%" + query + "%");
      spec = qSpec;
    }
    if (roleFilter != null) {
      org.springframework.data.jpa.domain.Specification<User> roleSpec =
        (root, cq, cb) -> cb.equal(root.get("role"), roleFilter);
      spec = spec == null ? roleSpec : spec.and(roleSpec);
    }
    return users.findAll(spec, page).map(UserResponse::from);
  }

  private Role parseRole(String value) {
    try {
      return Role.valueOf(value.toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bad role");
    }
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public UserResponse create(@Valid @RequestBody CreateUserRequest body) {
    if (users.findByUsername(body.username()).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "username taken");
    }
    var user = new User();
    user.setUsername(body.username());
    user.setPasswordHash(passwordEncoder.encode(body.password()));
    user.setRole(body.role());
    return UserResponse.from(users.save(user));
  }

  @PutMapping("/{id}/role")
  public UserResponse changeRole(@PathVariable Long id, @Valid @RequestBody ChangeRoleRequest body) {
    var caller = currentUser();
    var target = users.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
    if (target.getId().equals(caller.getId())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "cannot change own role");
    }
    if (target.getRole() == Role.ADMIN && body.role() != Role.ADMIN
        && users.countByRole(Role.ADMIN) == 1) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "cannot remove last admin");
    }
    target.setRole(body.role());
    return UserResponse.from(users.save(target));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    var caller = currentUser();
    var target = users.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
    if (target.getId().equals(caller.getId())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "cannot delete yourself");
    }
    if (target.getRole() == Role.ADMIN && users.countByRole(Role.ADMIN) == 1) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "cannot delete last admin");
    }
    users.delete(target);
  }
}
