package sh.dockside.api.deployment;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.zip.ZipEntry;
import java.util.zip.ZipException;
import java.util.zip.ZipInputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import sh.dockside.api.site.SiteRepository;

@RestController
@RequestMapping("/sites/{siteId}/deployments")
public class DeploymentController {
  private static final String DEPLOYMENT_CONFIG = "dockside.toml";

  private final SiteRepository sites;
  private final DeploymentRepository deployments;
  private final Path uploadDir;

  public DeploymentController(
    SiteRepository sites,
    DeploymentRepository deploments,
    @Value("${app.upload-dir}") String uploadDir
  ) throws IOException {
    this.sites = sites;
    this.deployments = deploments;
    this.uploadDir = Paths.get(uploadDir);
    Files.createDirectories(this.uploadDir);
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public DeploymentResponse upload(
    @PathVariable Long siteId,
    @RequestParam("file") MultipartFile file
  ) throws IOException {
    var site = sites.findById(siteId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "site not found"));
    if (file.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "empty file");
    }

    boolean hasIndex = false, hasDeploymentConfig = false;
    try (var zip = new ZipInputStream(file.getInputStream())) {
      ZipEntry e;
      while((e = zip.getNextEntry()) != null) {
        var name = e.getName();
        if (name.startsWith("/") || name.startsWith("\\")) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "absolute path: " + name);
        }
        if (Paths.get(name).normalize().toString().contains("..")) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "zip slip: " + name);
        }

        if (name.equals("index.html") || name.endsWith("/index.html")) {
          hasIndex = true;
        }
        if (name.equals(DEPLOYMENT_CONFIG)) {
          hasDeploymentConfig = true;
        }
      }
    } catch(ZipException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "not a zip");
    }

    if (!hasIndex && !hasDeploymentConfig) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "need index.html or " + DEPLOYMENT_CONFIG);
    }

    var nextVersion = deployments.findFirstBySiteIdOrderByVersionDesc(siteId)
      .map(Deployment::getVersion).orElse(0) + 1;
    var destination = uploadDir.resolve(site.getSlug() + "-v" + nextVersion + ".zip");
    file.transferTo(destination);

    var d = new Deployment();
    d.setSite(site);
    d.setVersion(nextVersion);
    d.setStatus(DeploymentStatus.running);
    d.setArtifactPath(destination.toString());
    d.setConfigJson("{}");

    return DeploymentResponse.from(deployments.save(d));
  }

  @GetMapping
  public Page<DeploymentResponse> history(@PathVariable Long siteId, Pageable pageable) {
    sites.findById(siteId)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "site not found"));
    return deployments.findBySiteIdOrderByVersionDesc(siteId, pageable)
      .map(DeploymentResponse::from);
  }
}
