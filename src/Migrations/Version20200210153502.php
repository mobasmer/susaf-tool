<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20200210153502 extends AbstractMigration
{
    public function getDescription() : string
    {
        return '';
    }

    public function up(Schema $schema) : void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->abortIf($this->connection->getDatabasePlatform()->getName() !== 'mysql', 'Migration can only be executed safely on \'mysql\'.');

        $this->addSql('CREATE TABLE effect (id INT AUTO_INCREMENT NOT NULL, description VARCHAR(255) NOT NULL, dimension VARCHAR(3) NOT NULL, order_of_effect VARCHAR(1) NOT NULL, is_positive TINYINT(1) NOT NULL, note LONGTEXT DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE effect_effect (effect_source INT NOT NULL, effect_target INT NOT NULL, INDEX IDX_CBA3FE6C224910ED (effect_source), INDEX IDX_CBA3FE6C3BAC4062 (effect_target), PRIMARY KEY(effect_source, effect_target)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE effect_effect ADD CONSTRAINT FK_CBA3FE6C224910ED FOREIGN KEY (effect_source) REFERENCES effect (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE effect_effect ADD CONSTRAINT FK_CBA3FE6C3BAC4062 FOREIGN KEY (effect_target) REFERENCES effect (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema) : void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->abortIf($this->connection->getDatabasePlatform()->getName() !== 'mysql', 'Migration can only be executed safely on \'mysql\'.');

        $this->addSql('ALTER TABLE effect_effect DROP FOREIGN KEY FK_CBA3FE6C224910ED');
        $this->addSql('ALTER TABLE effect_effect DROP FOREIGN KEY FK_CBA3FE6C3BAC4062');
        $this->addSql('DROP TABLE effect');
        $this->addSql('DROP TABLE effect_effect');
    }
}
