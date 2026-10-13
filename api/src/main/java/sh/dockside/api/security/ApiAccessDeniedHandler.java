package sh.dockside.api.security;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import tools.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import sh.dockside.api.common.ErrorResponse;

@Component
public class ApiAccessDeniedHandler implements AccessDeniedHandler {
  private final ObjectMapper mapper;

  public ApiAccessDeniedHandler(ObjectMapper mapper) {
    this.mapper = mapper;
  }

  @Override
  public void handle(HttpServletRequest req, HttpServletResponse res, AccessDeniedException ex)
      throws IOException {
    res.setStatus(HttpServletResponse.SC_FORBIDDEN);
    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
    mapper.writeValue(res.getOutputStream(),
      new ErrorResponse("FORBIDDEN", "forbidden", null));
  }
}
