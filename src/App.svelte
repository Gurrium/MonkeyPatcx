<script lang="ts">
  let files: FileList
  let fileName: String

  function handleFileInput() {
    fileName = files.item(0).name
  }
</script>

<main>
  <form>
    <label for="course-file-input">tcxファイル</label>
    <input
      bind:files
      on:change={handleFileInput}
      id="course-file-input"
      type="file"
      name="course-file"
      accept=".tcx"
      required
    />
  </form>

  {#if fileName}
    <div>
      {fileName}
    </div>
  {/if}
</main>

<style>
</style>
