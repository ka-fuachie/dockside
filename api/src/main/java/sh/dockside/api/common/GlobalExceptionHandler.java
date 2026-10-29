package sh.dockside.api.common;

import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException ex) {
    var fields = ex.getBindingResult().getFieldErrors().stream()
      .collect(Collectors.toMap(
        e -> e.getField(),
        e -> e.getDefaultMessage() != null ? e.getDefaultMessage() : "invalid",
        (a, b) -> a));

    return ResponseEntity.badRequest()
      .body(new ErrorResponse("BAD_REQUEST", "validation failed", fields));
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ErrorResponse> badCredentials(BadCredentialsException ex) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
      .body(new ErrorResponse("BAD_CREDENTIALS", "bad login", null));
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ErrorResponse> status(ResponseStatusException ex) {
    var status = HttpStatus.resolve(ex.getStatusCode().value());
    if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;
    var message = ex.getReason() != null ? ex.getReason(): status.getReasonPhrase();

    return ResponseEntity.status(status)
      .body(new ErrorResponse(status.name(), message, null));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> generic(Exception ex) {
    org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class)
      .error("unhandled endpoint error", ex);
    return ResponseEntity.internalServerError()
      .body(new ErrorResponse("INTERNAL_SERVER_ERROR", "unexpected error", null));
  }
}
