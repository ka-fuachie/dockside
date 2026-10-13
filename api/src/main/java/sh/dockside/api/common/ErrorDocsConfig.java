package sh.dockside.api.common;

import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;

@Configuration
public class ErrorDocsConfig {
  @Bean
  public OpenApiCustomizer errorResponse() {
    return openApi -> openApi.getPaths().values().forEach(item ->
      item.readOperations().forEach(this::addErrors));
  }

  public void addErrors(Operation op) {
    ApiResponses responses = op.getResponses();
    if (!responses.containsKey("400")) responses.addApiResponse("400", error("Bad request"));
    if (!responses.containsKey("401")) responses.addApiResponse("401", error("Unauthorized"));
    if (!responses.containsKey("403")) responses.addApiResponse("403", error("Forbidden"));
    if (!responses.containsKey("404")) responses.addApiResponse("404", error("Not found"));
    if (!responses.containsKey("500")) responses.addApiResponse("500", error("Unexpected error"));
  }

  private ApiResponse error(String description) {
    var schema = new Schema<>()
      .type("object")
      .addProperty("code", new Schema<>().type("string"))
      .addProperty("message", new Schema<>().type("string"))
      .addProperty("fields", new Schema<>().type("object")
        .additionalProperties(new Schema<>().type("string")));

    return new ApiResponse().description(description)
      .content(new Content().addMediaType("application/json", new MediaType().schema(schema)));
  }
}
